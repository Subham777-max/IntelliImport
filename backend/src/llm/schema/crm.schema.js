import { z } from "zod";

export const CRMRecordSchema = z.object({

    created_at: z.string().nullable(),

    name: z.string().nullable(),

    email: z.string().nullable(),

    country_code: z.string().nullable(),

    mobile_without_country_code: z.string().nullable(),

    company: z.string().nullable(),

    city: z.string().nullable(),

    state: z.string().nullable(),

    country: z.string().nullable(),

    lead_owner: z.string().nullable(),

    crm_status: z.enum([
        "GOOD_LEAD_FOLLOW_UP",
        "DID_NOT_CONNECT",
        "BAD_LEAD",
        "SALE_DONE"
    ]).nullable(),

    crm_note: z.string().nullable(),

    data_source: z.string().nullable(),

    possession_time: z.string().nullable(),

    description: z.string().nullable()

});

export const BatchResponseSchema = z.object({

    imported: z.array(CRMRecordSchema),

    skipped: z.array(

        z.object({

            originalRecord: z.record(z.any()),

            reason: z.string()

        })

    )

});